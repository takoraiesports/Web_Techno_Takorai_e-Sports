package storage

import (
	"context"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"time"

	"backend/internal/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsConfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type S3Service interface {
	UploadFile(ctx context.Context, file *multipart.FileHeader, folder string) (string, error)
}

type s3Service struct {
	client     *s3.Client
	bucketName string
	endpoint   string
}

func NewS3Service(cfg *config.Config) (S3Service, error) {
	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		if cfg.S3Endpoint != "" {
			return aws.Endpoint{
				URL:               cfg.S3Endpoint,
				HostnameImmutable: cfg.S3UsePathStyle,
				SigningRegion:     cfg.S3Region,
			}, nil
		}
		return aws.Endpoint{}, &aws.EndpointNotFoundError{}
	})

	awsCfg, err := awsConfig.LoadDefaultConfig(context.TODO(),
		awsConfig.WithRegion(cfg.S3Region),
		awsConfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.S3AccessKey, cfg.S3SecretKey, "")),
		awsConfig.WithEndpointResolverWithOptions(customResolver),
	)
	if err != nil {
		return nil, fmt.Errorf("unable to load AWS config: %w", err)
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = cfg.S3UsePathStyle
	})
	if cfg.S3CreateBucket {
		if _, err := client.HeadBucket(context.Background(), &s3.HeadBucketInput{Bucket: aws.String(cfg.S3BucketName)}); err != nil {
			if _, createErr := client.CreateBucket(context.Background(), &s3.CreateBucketInput{Bucket: aws.String(cfg.S3BucketName)}); createErr != nil {
				return nil, fmt.Errorf("ensure object storage bucket: %w", createErr)
			}
		}
	}

	return &s3Service{
		client:     client,
		bucketName: cfg.S3BucketName,
		endpoint:   cfg.S3Endpoint,
	}, nil
}

func (s *s3Service) UploadFile(ctx context.Context, fileHeader *multipart.FileHeader, folder string) (string, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer file.Close()

	ext := filepath.Ext(fileHeader.Filename)
	filename := fmt.Sprintf("%s/%d_%s%s", folder, time.Now().Unix(), uuid.New().String()[:8], ext)

	_, err = s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(filename),
		Body:        file,
		ContentType: aws.String(fileHeader.Header.Get("Content-Type")),
	})
	if err != nil {
		return "", fmt.Errorf("s3 upload error: %w", err)
	}

	fileURL := fmt.Sprintf("%s/%s/%s", s.endpoint, s.bucketName, filename)
	return fileURL, nil
}

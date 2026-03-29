# GitHub Actions S3 Deployment Setup

This project uses GitHub Actions to automatically deploy the frontend to an S3 bucket.

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository settings:

1. **AWS_ACCESS_KEY_ID**
   - Your AWS access key ID with S3 permissions

2. **AWS_SECRET_ACCESS_KEY**
   - Your AWS secret access key

3. **AWS_REGION**
   - AWS region where your S3 bucket is located (e.g., `us-east-1`)

4. **S3_BUCKET_NAME**
   - Name of your S3 bucket (e.g., `iantrainingfe`)

5. **CLOUDFRONT_DISTRIBUTION_ID** (optional)
   - CloudFront distribution ID if you're using CloudFront CDN
   - Only used for main branch deployments

## AWS IAM Policy Requirements

The AWS user needs the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::iantrainingfe",
                "arn:aws:s3:::iantrainingfe/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudfront:CreateInvalidation"
            ],
            "Resource": "*"
        }
    ]
}
```

## Deployment Triggers

- **Main branch**: Full deployment with CloudFront invalidation
- **Develop branch**: Deployment without CloudFront invalidation
- **Pull requests**: Build and test only (no deployment)

## Build Process

1. Type checking (`npm run type-check`)
2. Linting (`npm run lint`)
3. Build (`npm run build`)
4. Deploy `dist/` folder to S3
5. Optional CloudFront cache invalidation

## S3 Bucket Configuration

Make sure your S3 bucket is configured for static website hosting:

1. Enable static website hosting
2. Set index document to `index.html`
3. Set error document to `index.html` (for SPA routing)
4. Make bucket public or use CloudFront with OAI

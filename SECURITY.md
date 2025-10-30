# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please report it by emailing the maintainers. Do not open a public issue.

## Security Features

### API Key Protection

- **Format Validation**: API keys must start with `sk-gamma-` to prevent accidental use of invalid keys
- **Environment Variables**: Keys should always be stored in `.env` files, never committed to git
- **No Logging**: API keys are never logged or exposed in error messages

### Request Security

- **Payload Limits**: 
  - Max request body: 1MB
  - Max response content: 10MB
  - Prevents memory exhaustion attacks

- **Input Validation**:
  - All inputs validated with Zod schemas
  - String length limits enforced (inputText max 750k chars)
  - Enum values strictly validated

- **Timeout Protection**:
  - Default 30-second timeout (configurable via `GAMMA_TIMEOUT_MS`)
  - Prevents indefinite hanging requests

### Rate Limiting & Retry Logic

- **Exponential Backoff**: Automatic retry with increasing delays (1s, 2s, 4s...)
- **Jitter**: Random delays prevent thundering herd effect
- **Retry-After Header**: Respects API rate limit headers (429 responses)
- **Max Retries**: Configurable via `GAMMA_MAX_RETRIES` (default: 3)
- **Smart Retry**: Only retries server errors (5xx) and rate limits (429), not client errors (4xx)

### Error Handling

- **Sanitized Errors**: Internal error details not exposed to clients
- **Structured Responses**: Consistent error format for all failures
- **No Stack Traces**: Production errors don't leak implementation details

## Best Practices

### API Key Management

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Rotate keys regularly** - Update keys if potentially compromised
3. **Use separate keys** - Different keys for dev/staging/production
4. **Restrict permissions** - Use least-privilege principle

### Deployment Security

1. **Use HTTPS** - Always use secure connections
2. **Environment Variables** - Use secure secret management (not plain .env in production)
3. **Keep Dependencies Updated** - Run `npm audit` regularly
4. **Monitor Usage** - Track API calls and watch for anomalies

### Input Sanitization

All user inputs are validated:
- Length limits prevent buffer overflows
- Enum validation prevents injection
- Type checking prevents type confusion
- Trimming prevents whitespace attacks

## Security Checklist for Deployment

- [ ] API keys stored in secure secret manager (not plain files)
- [ ] HTTPS enabled for all API calls
- [ ] Rate limiting configured appropriately
- [ ] Monitoring and alerting set up
- [ ] Dependencies updated (`npm audit` passes)
- [ ] Error logging configured (server-side only)
- [ ] Timeout values tuned for your use case
- [ ] Retry limits appropriate for your traffic

## Dependency Security

This project uses:
- `axios` >= 1.12.0 (fixes CVE-2024-XXXX DoS vulnerability)
- `zod` for runtime validation
- `@modelcontextprotocol/sdk` for MCP protocol
- All dependencies regularly audited with `npm audit`

## Security Updates

To update dependencies and check for vulnerabilities:

```bash
npm audit
npm audit fix
npm update
```

## Contact

For security concerns, contact the maintainers or open a private security advisory on GitHub.

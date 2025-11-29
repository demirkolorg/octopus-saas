import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = jest.mocked(axios);

describe('ProxyService', () => {
  let service: ProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProxyService],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    jest.clearAllMocks();
  });

  describe('fetchAndRewriteHtml', () => {
    it('should fetch HTML and rewrite relative links to absolute', async () => {
      const mockHtml = `
        <html>
          <head>
            <link rel="stylesheet" href="/css/style.css">
          </head>
          <body>
            <img src="/images/logo.png">
            <a href="/about">About</a>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: mockHtml });

      const result = await service.fetchAndRewriteHtml('https://example.com/page');

      expect(result).toContain('href="https://example.com/css/style.css"');
      expect(result).toContain('src="https://example.com/images/logo.png"');
      expect(result).toContain('href="https://example.com/about"');
    });

    it('should handle protocol-relative URLs', async () => {
      const mockHtml = `
        <html>
          <body>
            <img src="//cdn.example.com/image.jpg">
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: mockHtml });

      const result = await service.fetchAndRewriteHtml('https://example.com');

      expect(result).toContain('src="https://cdn.example.com/image.jpg"');
    });

    it('should preserve absolute URLs', async () => {
      const mockHtml = `
        <html>
          <body>
            <a href="https://other-site.com/page">External Link</a>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: mockHtml });

      const result = await service.fetchAndRewriteHtml('https://example.com');

      expect(result).toContain('href="https://other-site.com/page"');
    });

    it('should remove script tags', async () => {
      const mockHtml = `
        <html>
          <body>
            <script>alert('xss')</script>
            <p>Content</p>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: mockHtml });

      const result = await service.fetchAndRewriteHtml('https://example.com');

      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Content</p>');
    });

    it('should throw BadRequestException for invalid URL', async () => {
      await expect(service.fetchAndRewriteHtml('not-a-valid-url')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for non-HTTP protocols', async () => {
      await expect(service.fetchAndRewriteHtml('ftp://example.com')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when target server returns 403', async () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 403 },
        message: 'Request failed with status code 403',
      };
      mockedAxios.get.mockRejectedValueOnce(axiosError);
      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(service.fetchAndRewriteHtml('https://example.com')).rejects.toThrow(
        'Access denied by target server (403)',
      );
    });

    it('should throw BadRequestException when target server returns 404', async () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 404 },
        message: 'Request failed with status code 404',
      };
      mockedAxios.get.mockRejectedValueOnce(axiosError);
      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(service.fetchAndRewriteHtml('https://example.com')).rejects.toThrow(
        'Page not found (404)',
      );
    });
  });

  describe('rewriteLinks', () => {
    it('should add base tag if not present', () => {
      const html = '<html><head></head><body></body></html>';
      const result = service.rewriteLinks(html, 'https://example.com');

      expect(result).toContain('<base href="https://example.com">');
    });

    it('should update existing base tag', () => {
      const html = '<html><head><base href="/old"></head><body></body></html>';
      const result = service.rewriteLinks(html, 'https://example.com');

      expect(result).toContain('href="https://example.com"');
      expect(result).not.toContain('href="/old"');
    });

    it('should preserve data URLs', () => {
      const html = '<html><body><img src="data:image/png;base64,ABC123"></body></html>';
      const result = service.rewriteLinks(html, 'https://example.com');

      expect(result).toContain('src="data:image/png;base64,ABC123"');
    });

    it('should preserve anchor links', () => {
      const html = '<html><body><a href="#section">Jump</a></body></html>';
      const result = service.rewriteLinks(html, 'https://example.com');

      expect(result).toContain('href="#section"');
    });

    it('should preserve mailto links', () => {
      const html = '<html><body><a href="mailto:test@example.com">Email</a></body></html>';
      const result = service.rewriteLinks(html, 'https://example.com');

      expect(result).toContain('href="mailto:test@example.com"');
    });

    it('should rewrite srcset attributes', () => {
      const html = `
        <html><body>
          <img srcset="/small.jpg 480w, /large.jpg 800w">
        </body></html>
      `;
      const result = service.rewriteLinks(html, 'https://example.com');

      expect(result).toContain('https://example.com/small.jpg 480w');
      expect(result).toContain('https://example.com/large.jpg 800w');
    });

    it('should rewrite CSS url() in style attributes', () => {
      const html = `
        <html><body>
          <div style="background: url('/bg.png')"></div>
        </body></html>
      `;
      const result = service.rewriteLinks(html, 'https://example.com');

      expect(result).toContain("url('https://example.com/bg.png')");
    });

    it('should rewrite CSS url() in style tags', () => {
      const html = `
        <html>
          <head>
            <style>
              .bg { background: url('/pattern.png'); }
            </style>
          </head>
          <body></body>
        </html>
      `;
      const result = service.rewriteLinks(html, 'https://example.com');

      expect(result).toContain("url('https://example.com/pattern.png')");
    });

    it('should handle relative paths correctly', () => {
      const html = '<html><body><img src="images/photo.jpg"></body></html>';
      const result = service.rewriteLinks(html, 'https://example.com/blog/post');

      expect(result).toContain('src="https://example.com/blog/images/photo.jpg"');
    });
  });
});

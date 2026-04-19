import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';


/******************************************************
 * content.config.ts 命名规范
*******************************************************/


// 测试博客与模板
const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});

// 模拟IC设计(后续模板代码)
const analog_ic = defineCollection({
	//加载
	loader: glob({ pattern: '**/*.{md,mdx}', base: "./src/content/analog_ic" }),
	schema: ({ image }) =>
		z.object({
			//所有博客必须有的基本信息
			title: z.string(), // 博客的标题 (如: Bandgap Reference 设计笔记)
			description: z.string(), // 博客简介
			pubDate: z.coerce.date(), // 标准发布日期
			projectId: z.string(), // 项目归属标记，用于生成网址后缀 (如: 'two_stage_ota')
			layoutType: z.string(), // 用于选择布局 (如: 'scifi' 或 'classical')
			//仅intro必须的信息
			projectName: z.optional(z.string()), // 用于在网页上显示的漂亮名字 (如: 'Two-stage OTA')
			projectDesc: z.optional(z.string()), // 用于在网页上显示的项目描述 (如: 'A two-stage OTA design')
			heroImage: z.optional(image()),//封面图片
		}),
});

//工作日志
const log = defineCollection({
	//加载
	loader: glob({ pattern: '**/*.{md,mdx}', base: "./src/content/log" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(), // 博客的标题 (如: Bandgap Reference 设计笔记)
			description: z.string(), // 博客简介
			pubDate: z.coerce.date(), // 标准发布日期
			layoutType: z.string(), // 用于选择布局 (如: 'scifi' 或 'classical')
			//封面信息
			heroImage: z.optional(image()),
		}),
});

export const collections = { blog, analog_ic, log };		

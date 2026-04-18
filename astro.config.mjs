// @ts-check
/***********************************************
 * Astro 插件管理与配置文件
 * “integrations” 配置项用于指定插件
 * “fonts” 配置项用于指定字体
 * “image” 配置项用于指定图片服务
 * **********************************************/

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

//markdown 数学排版插件
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex'; 

// https://astro.build/config
export default defineConfig({
	site: 'https://iceaxing.com',

	//插件声明
	integrations: [
		mdx({
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
		}),  
		sitemap()
	],
	//字体配置
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
	//图片服务配置
	//markdown配置
	markdown: {
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeKatex],
			shikiConfig: {
				theme: 'dracula', // 给你的代码块换个酷炫的黑客主题
				wrap: true, // 代码过长自动换行
			},
		},
});

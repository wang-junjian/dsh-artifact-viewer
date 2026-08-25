window.__ModuleLoader__.load({
	id: "@wang-junjian/dsh-artifact-viewer",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react = require("react");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		//#region \0dsh-css:/Users/junjian/GitHub/wang-junjian/dsh-artifact-viewer/src/client/ArtifactMessageImages.module.css.mjs
		const css$4 = "._5qjeXW_gallery{flex-wrap:wrap;gap:8px;margin:4px 0;display:flex}._5qjeXW_gallery[data-align=end]{justify-content:flex-end}._5qjeXW_frame{background:var(--dsw-alias-interactive-bg-hover);border-radius:8px;justify-content:center;align-items:center;width:64px;height:64px;display:flex;position:relative;overflow:hidden}._5qjeXW_img{object-fit:cover;width:100%;height:100%}._5qjeXW_loading{color:var(--dsw-alias-label-tertiary);font-size:11px}._5qjeXW_star{width:20px;height:20px;color:var(--dsw-static-neutral-bluish-00);cursor:pointer;background:#00000080;border:0;border-radius:4px;justify-content:center;align-items:center;padding:0;display:flex;position:absolute;top:4px;right:4px}._5qjeXW_star:hover{color:var(--dsw-alias-label-brand)}";
		const tagId$4 = "@wang-junjian/dsh-artifact-viewer/ArtifactMessageImages.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@wang-junjian/dsh-artifact-viewer";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var ArtifactMessageImages_module_css_default = {
			"frame": "_5qjeXW_frame",
			"gallery": "_5qjeXW_gallery",
			"img": "_5qjeXW_img",
			"loading": "_5qjeXW_loading",
			"star": "_5qjeXW_star"
		};
		//#endregion
		//#region lib/client/artifacts.js
		/** Artifact detection from a conversation snapshot. */
		/** Collect every artifact visible in the current conversation window. */
		function collectArtifacts(snapshot) {
			const artifacts = [];
			const seen = /* @__PURE__ */ new Set();
			const add = (artifact) => {
				if (seen.has(artifact.id)) return;
				seen.add(artifact.id);
				artifacts.push(artifact);
			};
			for (const node of snapshot.nodes) {
				if (node.kind === "tool-result" && !node.isError) collectToolArtifacts(node, add);
				if (node.kind === "user") collectUserArtifacts(node, add);
				if (node.kind === "assistant") collectAssistantArtifacts(node, add);
			}
			return artifacts;
		}
		function collectToolArtifacts(node, add) {
			const views = [node.resultView, node.callView];
			for (const view of views) {
				if (view === null) continue;
				if (view.card === "diff" || view.card === "generic" && view.kind === "edit") for (const location of view.locations ?? []) {
					const path = location.path;
					add({
						id: `file:${path}:${node.seq}`,
						kind: inferFileKind(path),
						name: basename(path),
						source: "tool",
						seq: node.seq,
						path
					});
				}
			}
			for (const block of node.content) if (isTextBlock(block)) {
				const text = block.text.trim();
				if (looksLikeJson(text)) add({
					id: `json:${node.seq}:${hash(text)}`,
					kind: "json",
					name: `Result ${node.seq}`,
					source: "tool",
					seq: node.seq
				});
			}
		}
		function collectUserArtifacts(node, add) {
			for (const block of node.content) if (isImageBlock(block)) add({
				id: `img:${block.attachment.attachmentId}`,
				kind: "image",
				name: block.attachment.name ?? `Image ${String(block.attachment.attachmentId).slice(0, 8)}`,
				source: "message",
				seq: node.seq,
				attachment: block.attachment
			});
		}
		function collectAssistantArtifacts(node, add) {
			for (const block of node.blocks) if (block.kind === "image") add({
				id: `img:${block.attachment.attachmentId}`,
				kind: "image",
				name: block.attachment.name ?? `Image ${String(block.attachment.attachmentId).slice(0, 8)}`,
				source: "message",
				seq: node.seq,
				attachment: block.attachment
			});
		}
		function isImageBlock(block) {
			return block.type === "image";
		}
		function isTextBlock(block) {
			return block.type === "text";
		}
		function inferFileKind(path) {
			const lower = path.toLowerCase();
			if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp") || lower.endsWith(".gif")) return "image";
			if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov")) return "video";
			if (lower.endsWith(".json")) return "json";
			return "file";
		}
		function basename(path) {
			const at = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
			return at === -1 ? path : path.slice(at + 1);
		}
		function looksLikeJson(text) {
			if (!(text.startsWith("{") && text.endsWith("}") || text.startsWith("[") && text.endsWith("]"))) return false;
			try {
				JSON.parse(text);
				return true;
			} catch {
				return false;
			}
		}
		function hash(text) {
			let h = 0;
			for (let i = 0; i < text.length; i++) h = h * 31 + text.charCodeAt(i) | 0;
			return String(h);
		}
		//#endregion
		//#region lib/client/display.js
		/** Display helpers: convert artifacts and bookmarks into a common list item. */
		function artifactToDisplay(artifact) {
			return {
				id: artifact.id,
				kind: artifact.kind,
				name: artifact.name,
				seq: artifact.seq,
				path: artifact.path,
				attachmentId: artifact.attachment?.attachmentId
			};
		}
		function bookmarkToDisplay(record) {
			return {
				id: record.id,
				kind: record.kind,
				name: record.name,
				seq: record.seq,
				path: record.path,
				attachmentId: record.attachmentId,
				sessionId: record.sessionId
			};
		}
		function artifactToBookmark(artifact, sessionId) {
			return {
				id: artifact.id,
				kind: artifact.kind,
				name: artifact.name,
				path: artifact.path,
				attachmentId: artifact.attachment?.attachmentId,
				seq: artifact.seq,
				sessionId,
				createdAt: Date.now()
			};
		}
		function displayItemToBookmark(item, sessionId) {
			return {
				id: item.id,
				kind: item.kind,
				name: item.name,
				path: item.path,
				attachmentId: item.attachmentId,
				seq: item.seq,
				sessionId: sessionId ?? item.sessionId ?? "",
				createdAt: Date.now()
			};
		}
		/** Build a transient display item from an absolute file path. */
		function createDisplayItemFromPath(path) {
			return {
				id: `path:${path}`,
				kind: inferFileKind(path),
				name: basename(path),
				seq: 0,
				path
			};
		}
		//#endregion
		//#region lib/client/StarIcon.js
		const STAR_PATH = "M8 1L9.76 5.57L14.66 5.84L10.85 8.93L12.11 13.66L8 11L3.89 13.66L5.15 8.93L1.34 5.84L6.24 5.57L8 1Z";
		function StarIcon({ size = 16, filled = false, ...rest }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				xmlns: "http://www.w3.org/2000/svg",
				...rest,
				children: (0, react_jsx_runtime.jsx)("path", {
					d: STAR_PATH,
					fill: filled ? "currentColor" : "none",
					stroke: "currentColor",
					strokeWidth: 1.4,
					strokeLinejoin: "round",
					strokeLinecap: "round"
				})
			});
		}
		//#endregion
		//#region lib/client/ArtifactMessageImages.js
		function ArtifactMessageImages({ images, loadImage, align, sessionId, useSessions, useBookmarks, bookmarks, t }) {
			const projectPath = useSessions((state) => sessionId === void 0 ? void 0 : state.byId[sessionId]?.cwd);
			const bookmarkIds = useBookmarks((state) => new Set(state.bookmarks.map((entry) => entry.id)));
			(0, react.useEffect)(() => {
				if (projectPath !== void 0) bookmarks.load(projectPath);
			}, [projectPath, bookmarks]);
			const variants = (0, react.useMemo)(() => images.map((image, index) => ({
				attachment: image.attachment,
				key: `${image.attachment.attachmentId}:${index}`,
				artifact: imageToArtifact(image.attachment, index)
			})), [images]);
			if (images.length === 0) return null;
			return (0, react_jsx_runtime.jsx)("div", {
				className: ArtifactMessageImages_module_css_default.gallery,
				"data-align": align,
				children: variants.map(({ attachment, key, artifact }) => (0, react_jsx_runtime.jsx)(ImageWithBookmark, {
					attachment,
					artifact,
					load: loadImage,
					bookmarked: bookmarkIds.has(artifact.id),
					onToggle: () => {
						if (projectPath === void 0 || sessionId === void 0) return;
						bookmarks.toggle(projectPath, artifactToBookmark(artifact, sessionId));
					},
					t
				}, key))
			});
		}
		function ImageWithBookmark({ attachment, load, bookmarked, onToggle, t }) {
			const [src, setSrc] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				let live = true;
				setSrc(null);
				load(attachment).then((url) => {
					if (live) setSrc(url);
				});
				return () => {
					live = false;
				};
			}, [attachment, load]);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ArtifactMessageImages_module_css_default.frame,
				children: [src === null ? (0, react_jsx_runtime.jsx)("span", {
					className: ArtifactMessageImages_module_css_default.loading,
					children: t("artifact.kind.image")
				}) : (0, react_jsx_runtime.jsx)("img", {
					src,
					alt: attachment.name ?? "",
					className: ArtifactMessageImages_module_css_default.img
				}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
					label: bookmarked ? t("artifact.remove") : t("artifact.bookmark"),
					side: "bottom",
					delayMs: 500,
					children: (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ArtifactMessageImages_module_css_default.star,
						onClick: onToggle,
						"aria-label": bookmarked ? t("artifact.bookmarked") : t("artifact.bookmark"),
						children: (0, react_jsx_runtime.jsx)(StarIcon, {
							size: 14,
							filled: bookmarked
						})
					})
				})]
			});
		}
		function imageToArtifact(attachment, seq) {
			return {
				id: `img:${attachment.attachmentId}`,
				kind: "image",
				name: attachment.name ?? `Image ${String(attachment.attachmentId).slice(0, 8)}`,
				source: "message",
				seq,
				attachment
			};
		}
		//#endregion
		//#region \0dsh-css:/Users/junjian/GitHub/wang-junjian/dsh-artifact-viewer/src/client/ArtifactPreview.module.css.mjs
		const css$3 = ".RHRaVa_preview{flex-direction:column;flex:1;min-height:0;display:flex;overflow:hidden}.RHRaVa_header{border-bottom:1px solid var(--dsw-alias-border-l2-darkmode-thin);flex-shrink:0;align-items:center;gap:8px;padding:8px 12px;display:flex}.RHRaVa_name{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;overflow:hidden}.RHRaVa_actions{flex-shrink:0;align-items:center;gap:4px;display:flex}.RHRaVa_bookmark,.RHRaVa_copy,.RHRaVa_open,.RHRaVa_session{width:24px;height:24px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:6px;flex:none;justify-content:center;align-items:center;padding:0;display:flex}.RHRaVa_bookmark[aria-pressed=true],.RHRaVa_session:hover,.RHRaVa_copy:hover,.RHRaVa_open:hover{color:var(--dsw-alias-label-brand)}.RHRaVa_content{background:var(--dsw-alias-bg-layer-1);min-height:0;color:var(--dsw-alias-label-secondary);flex:1;padding:12px;overflow:auto}.RHRaVa_error{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary);border-radius:6px;padding:8px;font-size:12px}.RHRaVa_placeholder{text-align:center;color:var(--dsw-alias-label-tertiary);padding:24px 0;font-size:13px}.RHRaVa_image{object-fit:contain;max-width:100%;max-height:100%}.RHRaVa_frame{background:#fff;border:0;width:100%;height:100%}.RHRaVa_code.md-code-block{background:0 0;border-radius:0;margin:0}.RHRaVa_code.md-code-block>div:first-child{display:none}.RHRaVa_code.md-code-block pre,.RHRaVa_code.md-code-block pre.shiki{counter-reset:line;font-family:var(--ds-font-family-code,ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);white-space:normal;word-break:normal;border-radius:0;padding:0;font-size:13px;line-height:18px;overflow-x:auto;background:0 0!important}.RHRaVa_code.md-code-block pre .line{white-space:pre;min-height:18px;padding-left:48px;display:block;position:relative}.RHRaVa_code.md-code-block pre .line:before{content:counter(line);counter-increment:line;text-align:right;width:36px;color:var(--dsw-alias-label-tertiary);user-select:none;padding-right:12px;position:absolute;left:0}.RHRaVa_plain{white-space:pre-wrap;word-break:break-word;margin:0;font-family:inherit;font-size:13px;line-height:20px}";
		const tagId$3 = "@wang-junjian/dsh-artifact-viewer/ArtifactPreview.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@wang-junjian/dsh-artifact-viewer";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var ArtifactPreview_module_css_default = {
			"actions": "RHRaVa_actions",
			"bookmark": "RHRaVa_bookmark",
			"code": "RHRaVa_code",
			"content": "RHRaVa_content",
			"copy": "RHRaVa_copy",
			"error": "RHRaVa_error",
			"frame": "RHRaVa_frame",
			"header": "RHRaVa_header",
			"image": "RHRaVa_image",
			"name": "RHRaVa_name",
			"open": "RHRaVa_open",
			"placeholder": "RHRaVa_placeholder",
			"plain": "RHRaVa_plain",
			"preview": "RHRaVa_preview",
			"session": "RHRaVa_session"
		};
		//#endregion
		//#region lib/client/ArtifactPreview.js
		function ArtifactPreview({ item, projectPath, rpc, onOpenPath, onOpenSession, isBookmarked, onToggleBookmark, t }) {
			const [preview, setPreview] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [copied, setCopied] = (0, react.useState)(false);
			const inferred = (0, react.useMemo)(() => inferMode(item), [item]);
			(0, react.useEffect)(() => {
				setPreview(null);
				setError(null);
				setCopied(false);
				if (projectPath === void 0) return;
				if (inferred.mode === "image") {
					if (item.path === void 0) return;
					loadImagePreview(projectPath, item.path, rpc, setPreview, setError);
					return;
				}
				if (item.path === void 0) return;
				let live = true;
				rpc.call("/artifact-viewer", "file/preview", {
					projectPath,
					path: item.path,
					encoding: "utf8"
				}).then((result) => {
					if (!live) return;
					if (!result.ok) {
						setError(result.error.message);
						return;
					}
					const value = result.value;
					setPreview(parseTextPreview(inferred, value.content));
				}).catch((e) => {
					if (live) setError(errorMessage(e));
				});
				return () => {
					live = false;
				};
			}, [
				item,
				projectPath,
				rpc,
				inferred
			]);
			const copyText = (0, react.useMemo)(() => preview === null ? void 0 : copyableText(preview), [preview]);
			const handleCopy = async () => {
				if (copyText === void 0) return;
				if (await (0, _deepseek_ai_dsh_client_ui_primitives.writeClipboard)(copyText)) {
					setCopied(true);
					setTimeout(() => {
						setCopied(false);
					}, 1500);
				}
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ArtifactPreview_module_css_default.preview,
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: ArtifactPreview_module_css_default.header,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: ArtifactPreview_module_css_default.name,
						children: item.name
					}), (0, react_jsx_runtime.jsxs)("div", {
						className: ArtifactPreview_module_css_default.actions,
						children: [
							(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
								label: isBookmarked ? t("artifact.remove") : t("artifact.bookmark"),
								side: "bottom",
								delayMs: 500,
								children: (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: ArtifactPreview_module_css_default.bookmark,
									"aria-pressed": isBookmarked,
									"aria-label": isBookmarked ? t("artifact.bookmarked") : t("artifact.bookmark"),
									onClick: () => {
										onToggleBookmark();
									},
									children: (0, react_jsx_runtime.jsx)(StarIcon, {
										size: 16,
										filled: isBookmarked
									})
								})
							}),
							copyText !== void 0 && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
								label: copied ? t("artifact.copied") : t("artifact.copy"),
								side: "bottom",
								delayMs: 500,
								children: (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: ArtifactPreview_module_css_default.copy,
									onClick: () => {
										handleCopy();
									},
									"aria-label": t("artifact.copy"),
									children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCopyOutline16, { size: 14 })
								})
							}),
							item.sessionId !== void 0 && onOpenSession !== void 0 && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
								label: t("artifact.session"),
								side: "bottom",
								delayMs: 500,
								children: (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: ArtifactPreview_module_css_default.session,
									onClick: () => {
										onOpenSession(item.sessionId);
									},
									"aria-label": t("artifact.session"),
									children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconNewChatOutline16, { size: 14 })
								})
							}),
							item.path !== void 0 && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
								label: t("artifact.open"),
								side: "bottom",
								delayMs: 500,
								children: (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: ArtifactPreview_module_css_default.open,
									onClick: () => {
										onOpenPath(item.path);
									},
									"aria-label": t("artifact.open"),
									children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, { size: 14 })
								})
							})
						]
					})]
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: ArtifactPreview_module_css_default.content,
					children: [error !== null && (0, react_jsx_runtime.jsxs)("div", {
						className: ArtifactPreview_module_css_default.error,
						children: [
							t("preview.error"),
							": ",
							error
						]
					}), preview !== null && renderPreview(preview, t)]
				})]
			});
		}
		function loadImagePreview(projectPath, path, rpc, setPreview, setError) {
			rpc.call("/artifact-viewer", "file/preview", {
				projectPath,
				path,
				encoding: "base64"
			}).then((result) => {
				if (!result.ok) {
					setError(result.error.message);
					return;
				}
				const value = result.value;
				setPreview({
					mode: "image",
					src: `data:${value.mediaType};base64,${value.data}`
				});
			}).catch((e) => {
				setError(errorMessage(e));
			});
		}
		function inferMode(item) {
			const lower = item.name.toLowerCase();
			if (lower.endsWith(".html") || lower.endsWith(".htm")) return { mode: "html" };
			if (lower.endsWith(".md") || lower.endsWith(".markdown")) return { mode: "markdown" };
			if (lower.endsWith(".svg")) return { mode: "svg" };
			if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp") || lower.endsWith(".gif")) return { mode: "image" };
			const codeLang = codeLanguage(lower);
			if (codeLang !== void 0) return {
				mode: "code",
				lang: codeLang
			};
			if (item.kind === "image") return { mode: "image" };
			return { mode: "plain" };
		}
		function codeLanguage(name) {
			if (name.endsWith(".py")) return "python";
			if (name.endsWith(".js")) return "javascript";
			if (name.endsWith(".ts")) return "typescript";
			if (name.endsWith(".jsx")) return "jsx";
			if (name.endsWith(".tsx")) return "tsx";
			if (name.endsWith(".css")) return "css";
			if (name.endsWith(".scss")) return "scss";
			if (name.endsWith(".less")) return "less";
			if (name.endsWith(".rs")) return "rust";
			if (name.endsWith(".go")) return "go";
			if (name.endsWith(".c")) return "c";
			if (name.endsWith(".cpp") || name.endsWith(".cc")) return "cpp";
			if (name.endsWith(".java")) return "java";
			if (name.endsWith(".kt")) return "kotlin";
			if (name.endsWith(".swift")) return "swift";
			if (name.endsWith(".rb")) return "ruby";
			if (name.endsWith(".php")) return "php";
			if (name.endsWith(".sh")) return "bash";
			if (name.endsWith(".sql")) return "sql";
			if (name.endsWith(".xml")) return "xml";
			if (name.endsWith(".yaml") || name.endsWith(".yml")) return "yaml";
			if (name.endsWith(".toml")) return "toml";
			if (name.endsWith(".dockerfile")) return "dockerfile";
			if (name.endsWith(".json")) return "json";
		}
		function parseTextPreview(inferred, content) {
			const { mode, lang } = inferred;
			if (mode === "code" && lang !== void 0) return {
				mode: "code",
				content,
				lang
			};
			if (mode === "markdown") return {
				mode: "markdown",
				content
			};
			if (mode === "html") return {
				mode: "html",
				content
			};
			if (mode === "svg") return {
				mode: "svg",
				content
			};
			if (mode === "plain") return {
				mode: "plain",
				content
			};
			return { mode: "unknown" };
		}
		function copyableText(preview) {
			switch (preview.mode) {
				case "plain":
				case "code":
				case "markdown":
				case "html":
				case "svg": return preview.content;
				default: return;
			}
		}
		function renderPreview(preview, t) {
			switch (preview.mode) {
				case "image": return (0, react_jsx_runtime.jsx)("img", {
					src: preview.src,
					alt: "",
					className: ArtifactPreview_module_css_default.image
				});
				case "html": return (0, react_jsx_runtime.jsx)("iframe", {
					className: ArtifactPreview_module_css_default.frame,
					sandbox: "",
					srcDoc: preview.content,
					title: t("artifact.preview")
				});
				case "svg": return (0, react_jsx_runtime.jsx)("img", {
					src: `data:image/svg+xml;utf8,${encodeURIComponent(preview.content)}`,
					alt: "",
					className: ArtifactPreview_module_css_default.image
				});
				case "markdown": return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, { text: preview.content });
				case "code": return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.CodeBlock, {
					code: preview.content,
					lang: preview.lang,
					className: ArtifactPreview_module_css_default.code,
					copyLabel: t("artifact.copy"),
					copiedLabel: t("artifact.copied")
				});
				case "plain": return (0, react_jsx_runtime.jsx)("pre", {
					className: ArtifactPreview_module_css_default.plain,
					children: preview.content
				});
				default: return (0, react_jsx_runtime.jsx)("div", {
					className: ArtifactPreview_module_css_default.placeholder,
					children: t("artifact.kind.unknown")
				});
			}
		}
		function errorMessage(e) {
			return e instanceof Error ? e.message : String(e);
		}
		//#endregion
		//#region lib/client/ArtifactKindIcon.js
		/** Small kind icon shown before an artifact name in the list. */
		function ArtifactKindIcon({ item, size = 14 }) {
			const common = {
				size,
				className: void 0
			};
			switch (item.kind) {
				case "image": return (0, react_jsx_runtime.jsx)(ImageIcon, { ...common });
				case "video": return (0, react_jsx_runtime.jsx)(VideoIcon, { ...common });
				case "json": return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDataOutline16, { ...common });
				case "file":
					if (item.name.toLowerCase().endsWith(".txt") || item.name.toLowerCase().endsWith(".md") || item.name.toLowerCase().endsWith(".log")) return (0, react_jsx_runtime.jsx)(TextIcon, { ...common });
					if (codeLanguage(item.name) !== void 0) return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCodeOutline16, { ...common });
					return (0, react_jsx_runtime.jsx)(FileIcon, { ...common });
				default: return (0, react_jsx_runtime.jsx)(FileIcon, { ...common });
			}
		}
		function FileIcon({ size = 14 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.4,
				strokeLinejoin: "round",
				strokeLinecap: "round",
				children: [(0, react_jsx_runtime.jsx)("path", { d: "M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z" }), (0, react_jsx_runtime.jsx)("path", { d: "M9 2v4h4" })]
			});
		}
		function ImageIcon({ size = 14 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.4,
				strokeLinejoin: "round",
				strokeLinecap: "round",
				children: [
					(0, react_jsx_runtime.jsx)("rect", {
						x: "2",
						y: "3",
						width: "12",
						height: "10",
						rx: "1"
					}),
					(0, react_jsx_runtime.jsx)("path", { d: "M3 12l3-3 2 2 3-3 2 2" }),
					(0, react_jsx_runtime.jsx)("circle", {
						cx: "11.5",
						cy: "6.5",
						r: "1.5"
					})
				]
			});
		}
		function VideoIcon({ size = 14 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.4,
				strokeLinejoin: "round",
				strokeLinecap: "round",
				children: [(0, react_jsx_runtime.jsx)("rect", {
					x: "2",
					y: "4",
					width: "12",
					height: "8",
					rx: "1"
				}), (0, react_jsx_runtime.jsx)("path", { d: "M7 6.5l4 1.5-4 1.5z" })]
			});
		}
		function TextIcon({ size = 14 }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.4,
				strokeLinejoin: "round",
				strokeLinecap: "round",
				children: (0, react_jsx_runtime.jsx)("path", { d: "M3 5h10M3 8h10M3 11h6" })
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/junjian/GitHub/wang-junjian/dsh-artifact-viewer/src/client/ArtifactList.module.css.mjs
		const css$2 = ".tcTREa_list{flex-direction:column;gap:4px;margin:0;padding:0;list-style:none;display:flex}.tcTREa_row{background:0 0;border-radius:8px;align-items:center;gap:8px;padding:4px;display:flex}.tcTREa_select{min-width:0;color:var(--dsw-alias-label-primary);cursor:pointer;text-align:left;background:0 0;border:0;border-radius:6px;flex:1;align-items:center;gap:8px;padding:6px 8px;display:flex}.tcTREa_kind{width:18px;height:18px;color:var(--dsw-alias-label-secondary);flex:none;justify-content:center;align-items:center;display:inline-flex}.tcTREa_name{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;font-size:13px;overflow:hidden}.tcTREa_star,.tcTREa_session{width:24px;height:24px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:6px;flex:none;justify-content:center;align-items:center;padding:0;display:flex}.tcTREa_session:hover,.tcTREa_star:hover{color:var(--dsw-alias-label-brand)}";
		const tagId$2 = "@wang-junjian/dsh-artifact-viewer/ArtifactList.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@wang-junjian/dsh-artifact-viewer";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var ArtifactList_module_css_default = {
			"kind": "tcTREa_kind",
			"list": "tcTREa_list",
			"name": "tcTREa_name",
			"row": "tcTREa_row",
			"select": "tcTREa_select",
			"session": "tcTREa_session",
			"star": "tcTREa_star"
		};
		//#endregion
		//#region lib/client/ArtifactList.js
		/** Scrollable list of artifacts inside the panel. */
		function ArtifactList({ items, bookmarkIds, showSessionLink, onSelect, onToggleBookmark, onOpenSession, t }) {
			return (0, react_jsx_runtime.jsx)("ul", {
				className: ArtifactList_module_css_default.list,
				children: items.map((item) => (0, react_jsx_runtime.jsxs)("li", {
					className: ArtifactList_module_css_default.row,
					children: [
						(0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ArtifactList_module_css_default.select,
							onClick: () => onSelect(item.id),
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: ArtifactList_module_css_default.kind,
								children: (0, react_jsx_runtime.jsx)(ArtifactKindIcon, {
									item,
									size: 14
								})
							}), (0, react_jsx_runtime.jsx)("span", {
								className: ArtifactList_module_css_default.name,
								children: item.name
							})]
						}),
						showSessionLink && item.sessionId !== void 0 && onOpenSession !== void 0 && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
							label: t("artifact.session"),
							side: "bottom",
							delayMs: 500,
							children: (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ArtifactList_module_css_default.session,
								onClick: (event) => {
									event.stopPropagation();
									onOpenSession(item.sessionId);
								},
								"aria-label": t("artifact.session"),
								children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconNewChatOutline16, { size: 14 })
							})
						}),
						(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
							label: bookmarkIds.has(item.id) ? t("artifact.remove") : t("artifact.bookmark"),
							side: "bottom",
							delayMs: 500,
							children: (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ArtifactList_module_css_default.star,
								onClick: (event) => {
									event.stopPropagation();
									onToggleBookmark(item);
								},
								"aria-label": bookmarkIds.has(item.id) ? t("artifact.bookmarked") : t("artifact.bookmark"),
								children: (0, react_jsx_runtime.jsx)(StarIcon, {
									size: 16,
									filled: bookmarkIds.has(item.id)
								})
							})
						})
					]
				}, item.id))
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/junjian/GitHub/wang-junjian/dsh-artifact-viewer/src/client/ArtifactPanel.module.css.mjs
		const css$1 = ".VALtQq_panel{background:var(--dsw-bg-float);border-left:1px solid var(--dsw-alias-border-l2);pointer-events:auto;z-index:100;flex-direction:column;width:420px;display:flex;position:fixed;top:0;bottom:0;right:0}.VALtQq_panel.VALtQq_expanded{z-index:200;background:var(--dsw-alias-bg-base);width:100vw;backdrop-filter:var(--dsw-mask-blur);border-left:none}.VALtQq_panel.VALtQq_expanded.VALtQq_opaque{background:var(--dsw-static-neutral-bluish-00);backdrop-filter:none}body[data-ds-dark-theme] .VALtQq_panel.VALtQq_expanded.VALtQq_opaque{background:var(--dsw-static-neutral-bluish-950)}.VALtQq_resizeHandle{cursor:col-resize;z-index:1;width:8px;position:absolute;top:0;bottom:0;left:-4px}.VALtQq_header{border-bottom:1px solid var(--dsw-alias-border-l2);flex-shrink:0;align-items:center;gap:12px;padding:12px 16px;display:flex}.VALtQq_title{color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border:0;flex-shrink:0;align-items:center;gap:8px;padding:0;font-size:16px;font-weight:600;display:flex}.VALtQq_title:hover,.VALtQq_title[aria-pressed=true]{color:var(--dsw-alias-label-brand)}.VALtQq_previewTabs{flex:1;gap:4px;min-width:0;display:flex;overflow:hidden}.VALtQq_previewTab,.VALtQq_previewTabActive{border:1px solid var(--dsw-alias-border-l2);min-width:0;max-width:140px;color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;background:0 0;border-radius:6px;flex:0 auto;align-items:center;gap:6px;padding:4px 8px;font-size:12px;display:inline-flex}.VALtQq_previewTabActive{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}.VALtQq_previewTabName{text-overflow:ellipsis;overflow:hidden}.VALtQq_previewTabClose{width:16px;height:16px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:4px;flex-shrink:0;justify-content:center;align-items:center;padding:0;display:flex}.VALtQq_actions{flex-shrink:0;align-items:center;gap:4px;margin-left:auto;display:flex}.VALtQq_bookmarks,.VALtQq_expand,.VALtQq_close{width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:6px;justify-content:center;align-items:center;padding:0;display:flex}.VALtQq_bookmarks[aria-pressed=true]{color:var(--dsw-alias-label-brand)}.VALtQq_expand[aria-pressed=true]{color:var(--dsw-alias-label-primary)}.VALtQq_body{flex:1;min-height:0;padding:12px 16px;overflow-y:auto}.VALtQq_empty{text-align:center;color:var(--dsw-alias-label-tertiary);padding:24px 0;font-size:14px}.VALtQq_preview{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;flex:1;min-height:0;display:flex}";
		const tagId$1 = "@wang-junjian/dsh-artifact-viewer/ArtifactPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@wang-junjian/dsh-artifact-viewer";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var ArtifactPanel_module_css_default = {
			"actions": "VALtQq_actions",
			"body": "VALtQq_body",
			"bookmarks": "VALtQq_bookmarks",
			"close": "VALtQq_close",
			"empty": "VALtQq_empty",
			"expand": "VALtQq_expand",
			"expanded": "VALtQq_expanded",
			"header": "VALtQq_header",
			"opaque": "VALtQq_opaque",
			"panel": "VALtQq_panel",
			"preview": "VALtQq_preview",
			"previewTab": "VALtQq_previewTab",
			"previewTabActive": "VALtQq_previewTabActive",
			"previewTabClose": "VALtQq_previewTabClose",
			"previewTabName": "VALtQq_previewTabName",
			"previewTabs": "VALtQq_previewTabs",
			"resizeHandle": "VALtQq_resizeHandle",
			"title": "VALtQq_title"
		};
		//#endregion
		//#region lib/client/ArtifactPanel.js
		/** Floating artifact/bookmark panel rendered in shell.overlay. */
		const PUSH_CLASS = "dsh-artifact-viewer-pushed";
		const LAYOUT_STYLE_ID = "dsh-artifact-viewer-layout";
		const MIN_WIDTH = 320;
		const MAX_WIDTH = 720;
		function ArtifactPanel({ useStore, actions, useCurrentSession, useBookmarks, bookmarks, rpc, onOpenPath, onOpenSession, useSessions, t }) {
			const panelOpen = useStore((state) => state.panelOpen);
			const expanded = useStore((state) => state.expanded);
			const width = useStore((state) => state.width);
			const activeTab = useStore((state) => state.activeTab);
			const pendingOpenPath = useStore((state) => state.pendingOpenPath);
			const sessionSnapshot = useCurrentSession((snapshot) => snapshot);
			const projectPath = useSessions((state) => {
				const current = state.current;
				return current === void 0 ? void 0 : state.byId[current]?.cwd;
			});
			const bookmarkState = useBookmarks((state) => state);
			const [previewTabs, setPreviewTabs] = (0, react.useState)([]);
			const [activePreviewId, setActivePreviewId] = (0, react.useState)(void 0);
			const [maxVisible, setMaxVisible] = (0, react.useState)(Infinity);
			const [opaqueBg, setOpaqueBg] = (0, react.useState)(false);
			const tabsRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (panelOpen && projectPath !== void 0) bookmarks.load(projectPath);
			}, [
				panelOpen,
				projectPath,
				bookmarks
			]);
			(0, react.useEffect)(() => {
				const element = tabsRef.current;
				if (element === null) return;
				const MIN_TAB_WIDTH = 60;
				const update = () => {
					const width = element.clientWidth;
					const minTotal = previewTabs.length * MIN_TAB_WIDTH;
					setMaxVisible(minTotal <= width ? Infinity : Math.max(1, Math.floor(width / MIN_TAB_WIDTH)));
				};
				update();
				const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
				observer?.observe(element);
				return () => {
					observer?.disconnect();
				};
			}, [previewTabs.length]);
			const currentArtifacts = (0, react.useMemo)(() => {
				if (sessionSnapshot === void 0) return [];
				return collectArtifacts(sessionSnapshot);
			}, [sessionSnapshot]);
			const bookmarkArtifacts = (0, react.useMemo)(() => bookmarkState.bookmarks.map(bookmarkToDisplay), [bookmarkState.bookmarks]);
			const displayedItems = activeTab === "current" ? currentArtifacts.map(artifactToDisplay) : bookmarkArtifacts;
			const bookmarkIds = (0, react.useMemo)(() => new Set(bookmarkState.bookmarks.map((entry) => entry.id)), [bookmarkState.bookmarks]);
			const activePreviewItem = (0, react.useMemo)(() => previewTabs.find((tab) => tab.id === activePreviewId)?.item, [previewTabs, activePreviewId]);
			const activePreviewBookmarked = activePreviewItem !== void 0 && bookmarkIds.has(activePreviewItem.id);
			const handleToggleActiveBookmark = () => {
				if (activePreviewItem === void 0) return;
				toggleBookmark(activePreviewItem, sessionSnapshot?.sessionId, projectPath, bookmarks);
			};
			const openPreview = (0, react.useCallback)((item) => {
				setPreviewTabs((tabs) => {
					const next = tabs.some((tab) => tab.id === item.id) ? tabs : [...tabs, {
						id: item.id,
						item
					}];
					setActivePreviewId(item.id);
					return next;
				});
			}, []);
			const closePreviewTab = (id) => {
				setPreviewTabs((tabs) => {
					const index = tabs.findIndex((tab) => tab.id === id);
					if (index === -1) return tabs;
					const next = tabs.slice();
					next.splice(index, 1);
					if (activePreviewId === id) {
						const fallback = next[index] ?? next[index - 1] ?? next[0];
						setActivePreviewId(fallback?.id);
					}
					return next;
				});
			};
			const showCurrentArtifacts = () => {
				setActivePreviewId(void 0);
				actions.setTab("current");
			};
			const showBookmarks = () => {
				setActivePreviewId(void 0);
				actions.setTab("bookmarks");
			};
			const panelRef = (0, react.useRef)(null);
			const resizeStart = (0, react.useRef)(void 0);
			(0, react.useEffect)(() => {
				if (!expanded || typeof document === "undefined") return;
				const body = document.body;
				const computed = getComputedStyle(body);
				const bgBase = computed.getPropertyValue("--dsw-alias-bg-base").trim();
				const bgImage = computed.backgroundImage.trim();
				const isImageOrTransparent = bgBase.includes("url(") || bgBase === "transparent" || /^rgba?\(.*,\s*0\s*\)/.test(bgBase) || bgImage !== "none";
				setOpaqueBg(isImageOrTransparent);
			}, [expanded]);
			(0, react.useEffect)(() => {
				if (typeof document === "undefined") return;
				const FILE_LINK_SELECTOR = "[class*=\"fileLink\"]";
				const FILE_MENTION_SELECTOR = "[class*=\"fileMention\"]";
				const onClick = (event) => {
					const target = event.target;
					if (!(target instanceof Element)) return;
					const fileLink = target.closest(FILE_LINK_SELECTOR);
					if (fileLink instanceof HTMLElement) {
						const path = fileLink.textContent?.trim();
						if (path !== void 0 && path !== "") {
							event.preventDefault();
							event.stopPropagation();
							actions.openArtifactByPath(path);
							return;
						}
					}
					if (target.closest("[data-produced-files-row]") instanceof HTMLElement) {
						const chip = target.closest("button");
						if (chip instanceof HTMLButtonElement) {
							const path = chip.title.trim();
							if (path !== "") {
								event.preventDefault();
								event.stopPropagation();
								actions.openArtifactByPath(path);
								return;
							}
						}
					}
					const fileMention = target.closest(FILE_MENTION_SELECTOR);
					if (fileMention instanceof HTMLElement) {
						const path = fileMention.title.trim();
						if (path !== "") {
							event.preventDefault();
							event.stopPropagation();
							actions.openArtifactByPath(path);
							return;
						}
					}
					const anchor = target.closest("a");
					if (anchor instanceof HTMLAnchorElement) {
						const rawHref = anchor.getAttribute("href")?.trim();
						if (rawHref !== void 0 && rawHref !== "" && !isExternalUrl(rawHref)) {
							const path = stripFileProtocol(rawHref);
							if (looksLikeFilePath(path)) {
								event.preventDefault();
								event.stopPropagation();
								actions.openArtifactByPath(path);
								return;
							}
						}
					}
					const code = target.closest("code");
					if (code instanceof HTMLElement && code.closest("pre") === null) {
						const path = code.textContent?.trim();
						if (path !== void 0 && looksLikeAbsolutePath(path)) {
							event.preventDefault();
							event.stopPropagation();
							actions.openArtifactByPath(path);
						}
					}
				};
				document.addEventListener("click", onClick, true);
				return () => {
					document.removeEventListener("click", onClick, true);
				};
			}, [actions]);
			(0, react.useEffect)(() => {
				if (pendingOpenPath === void 0 || projectPath === void 0) return;
				const normalizedPath = stripFileProtocol(pendingOpenPath);
				const absolutePath = normalizedPath.startsWith("/") ? normalizedPath : `${projectPath}/${normalizedPath.replace(/^\.\//, "")}`;
				const existing = currentArtifacts.find((artifact) => artifact.path === absolutePath);
				if (existing !== void 0) openPreview(artifactToDisplay(existing));
				else openPreview(createDisplayItemFromPath(absolutePath));
				actions.clearPendingOpenPath();
			}, [
				pendingOpenPath,
				projectPath,
				currentArtifacts,
				actions,
				openPreview
			]);
			(0, react.useEffect)(() => {
				if (typeof document === "undefined") return;
				let style = document.getElementById(LAYOUT_STYLE_ID);
				if (style === null) {
					style = document.createElement("style");
					style.id = LAYOUT_STYLE_ID;
					style.textContent = `
        .${PUSH_CLASS} > div:nth-child(2),
        .${PUSH_CLASS} > div:nth-child(3) {
          margin-right: var(--dsh-artifact-viewer-width, 0px) !important;
          transition: margin-right var(--ds-transition-duration-slow, 0.2s) var(--ds-ease-in-out, ease);
        }
      `;
					document.head.appendChild(style);
				}
				return () => {
					style?.remove();
				};
			}, []);
			(0, react.useEffect)(() => {
				if (typeof document === "undefined") return;
				const frame = (() => {
					let el = panelRef.current;
					while (el !== null) {
						if (el.hasAttribute("data-shell-overlay")) return el.parentElement;
						el = el.parentElement;
					}
					return document.querySelector("[data-shell-overlay]")?.parentElement ?? null;
				})();
				if (!(frame instanceof HTMLElement)) return;
				if (panelOpen && !expanded) {
					frame.classList.add(PUSH_CLASS);
					frame.style.setProperty("--dsh-artifact-viewer-width", `${width}px`);
				} else {
					frame.classList.remove(PUSH_CLASS);
					frame.style.removeProperty("--dsh-artifact-viewer-width");
				}
			}, [
				panelOpen,
				expanded,
				width
			]);
			const onResizeStart = (0, react.useCallback)((event) => {
				resizeStart.current = {
					x: event.clientX,
					width
				};
				event.currentTarget.setPointerCapture(event.pointerId);
			}, [width]);
			const onResizeMove = (0, react.useCallback)((event) => {
				if (resizeStart.current === void 0) return;
				const dx = resizeStart.current.x - event.clientX;
				const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStart.current.width + dx));
				actions.setWidth(next);
			}, [actions]);
			const onResizeEnd = (0, react.useCallback)((event) => {
				if (resizeStart.current === void 0) return;
				event.currentTarget.releasePointerCapture(event.pointerId);
				resizeStart.current = void 0;
			}, []);
			if (!panelOpen) return null;
			return (0, react_jsx_runtime.jsxs)("div", {
				ref: panelRef,
				className: `${ArtifactPanel_module_css_default.panel} ${expanded ? ArtifactPanel_module_css_default.expanded : ""} ${expanded && opaqueBg ? ArtifactPanel_module_css_default.opaque : ""}`,
				style: { width: expanded ? "100vw" : width },
				role: "dialog",
				"aria-label": t("panel.title"),
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: ArtifactPanel_module_css_default.resizeHandle,
						onPointerDown: onResizeStart,
						onPointerMove: onResizeMove,
						onPointerUp: onResizeEnd
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ArtifactPanel_module_css_default.header,
						children: [
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: ArtifactPanel_module_css_default.title,
								"aria-pressed": activeTab === "current",
								onClick: showCurrentArtifacts,
								title: t("tab.current"),
								children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDataOutline16, { size: 16 }), t("panel.title")]
							}),
							previewTabs.length > 0 && (0, react_jsx_runtime.jsx)("div", {
								ref: tabsRef,
								className: ArtifactPanel_module_css_default.previewTabs,
								children: previewTabs.slice(-maxVisible).map((tab) => (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: tab.id === activePreviewId ? ArtifactPanel_module_css_default.previewTabActive : ArtifactPanel_module_css_default.previewTab,
									onClick: () => {
										setActivePreviewId(tab.id);
									},
									children: [(0, react_jsx_runtime.jsx)("span", {
										className: ArtifactPanel_module_css_default.previewTabName,
										children: tab.item.name
									}), (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: ArtifactPanel_module_css_default.previewTabClose,
										onClick: (event) => {
											event.stopPropagation();
											closePreviewTab(tab.id);
										},
										"aria-label": t("tab.close"),
										children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, { size: 12 })
									})]
								}, tab.id))
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: ArtifactPanel_module_css_default.actions,
								children: [
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: ArtifactPanel_module_css_default.bookmarks,
										"aria-pressed": activeTab === "bookmarks",
										title: t("panel.bookmarks"),
										onClick: showBookmarks,
										children: (0, react_jsx_runtime.jsx)(StarIcon, {
											size: 16,
											filled: activeTab === "bookmarks"
										})
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: ArtifactPanel_module_css_default.expand,
										"aria-pressed": expanded,
										title: expanded ? t("panel.shrink") : t("panel.expand"),
										onClick: () => actions.toggleExpand(),
										children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFullscreenOutline16, { size: 16 })
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: ArtifactPanel_module_css_default.close,
										onClick: () => actions.closePanel(),
										"aria-label": t("panel.close"),
										children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, { size: 16 })
									})
								]
							})
						]
					}),
					activePreviewItem === void 0 ? (0, react_jsx_runtime.jsx)("div", {
						className: ArtifactPanel_module_css_default.body,
						children: displayedItems.length === 0 ? (0, react_jsx_runtime.jsx)("div", {
							className: ArtifactPanel_module_css_default.empty,
							children: activeTab === "current" ? t("empty.current") : t("empty.bookmarks")
						}) : (0, react_jsx_runtime.jsx)(ArtifactList, {
							items: displayedItems,
							bookmarkIds,
							showSessionLink: activeTab === "bookmarks",
							onSelect: (id) => {
								const item = displayedItems.find((entry) => entry.id === id);
								if (item !== void 0) openPreview(item);
							},
							onToggleBookmark: (item) => toggleBookmark(item, sessionSnapshot?.sessionId, projectPath, bookmarks),
							onOpenSession: (sessionId) => {
								onOpenSession(sessionId);
							},
							t
						})
					}) : (0, react_jsx_runtime.jsx)("div", {
						className: ArtifactPanel_module_css_default.preview,
						children: (0, react_jsx_runtime.jsx)(ArtifactPreview, {
							item: activePreviewItem,
							projectPath,
							rpc,
							onOpenPath,
							onOpenSession,
							isBookmarked: activePreviewBookmarked,
							onToggleBookmark: handleToggleActiveBookmark,
							t
						})
					})
				]
			});
		}
		function toggleBookmark(item, sessionId, projectPath, bookmarks) {
			if (projectPath === void 0) return;
			const resolvedSessionId = sessionId ?? item.sessionId;
			if (resolvedSessionId === void 0) return;
			bookmarks.toggle(projectPath, displayItemToBookmark(item, resolvedSessionId));
		}
		function looksLikeAbsolutePath(text) {
			if (text.length < 2) return false;
			if (text.startsWith("/")) return true;
			if (/^[A-Za-z]:[\\/]/.test(text)) return true;
			return false;
		}
		function looksLikeFilePath(text) {
			if (text.length < 2) return false;
			if (text.startsWith("/")) return true;
			if (/^[A-Za-z]:[\\/]/.test(text)) return true;
			if (text.startsWith("./") || text.startsWith("../")) return true;
			if (/^[^/]+\.[^./]+$/.test(text)) return true;
			return false;
		}
		function isExternalUrl(href) {
			return /^(https?|ftp|mailto|data|blob):/i.test(href);
		}
		function stripFileProtocol(href) {
			if (href.startsWith("file://")) return href.slice(7);
			return href;
		}
		//#endregion
		//#region \0dsh-css:/Users/junjian/GitHub/wang-junjian/dsh-artifact-viewer/src/client/ArtifactToggle.module.css.mjs
		const css = ".uQD47q_trigger{box-sizing:border-box;cursor:pointer;width:calc(100% + 4px);height:42px;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:12px;flex:none;align-items:center;gap:8px;margin:4px -2px;padding:0 10px 0 8px;font-family:inherit;font-size:14px;line-height:22px;display:flex;overflow:hidden}.uQD47q_trigger:hover{background:var(--dsw-alias-interactive-bg-hover)}.uQD47q_trigger[aria-pressed=true]{color:var(--dsw-alias-label-brand)}.uQD47q_trigger.uQD47q_rail{border-radius:50%;justify-content:center;gap:0;width:36px;height:36px;margin:8px 0 10px;padding:0}.uQD47q_label{white-space:nowrap;overflow:hidden}";
		const tagId = "@wang-junjian/dsh-artifact-viewer/ArtifactToggle.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@wang-junjian/dsh-artifact-viewer";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var ArtifactToggle_module_css_default = {
			"label": "uQD47q_label",
			"rail": "uQD47q_rail",
			"trigger": "uQD47q_trigger"
		};
		//#endregion
		//#region lib/client/ArtifactToggle.js
		/** Sidebar footer toggle that opens/closes the artifact panel. */
		function ArtifactToggle({ wide, useStore, actions, t }) {
			const open = useStore((state) => state.panelOpen);
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: `${ArtifactToggle_module_css_default.trigger} ${wide ? "" : ArtifactToggle_module_css_default.rail}`,
				onClick: () => actions.togglePanel(),
				"aria-pressed": open,
				title: t("toggle.tooltip"),
				children: [wide ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDataOutline16, { size: 16 }) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDataOutline16, { size: 18 }), wide && (0, react_jsx_runtime.jsx)("span", {
					className: ArtifactToggle_module_css_default.label,
					children: t("toggle.label")
				})]
			});
		}
		//#endregion
		//#region lib/client/bookmarks.js
		/** Browser-side bookmark controller backed by the host RPC channel. */
		const CHANNEL = "/artifact-viewer";
		var BookmarkController = class {
			rpc;
			/** Observable snapshot of the loaded bookmarks. */
			store;
			constructor(rpc) {
				this.rpc = rpc;
				this.store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
					status: "idle",
					bookmarks: [],
					error: null
				});
			}
			/** Load bookmarks for the given project directory. */
			async load(projectPath) {
				this.store.update((state) => {
					state.status = "loading";
					state.error = null;
				});
				const result = await this.rpc.call(CHANNEL, "bookmarks/read", { projectPath });
				if (!result.ok) {
					this.fail(result.error.message);
					return;
				}
				const value = result.value;
				if (!Array.isArray(value)) {
					this.fail("bookmarks file is not an array");
					return;
				}
				this.store.update((state) => {
					state.status = "ready";
					state.bookmarks = value;
				});
			}
			/** Add one bookmark; duplicates replace the previous entry with the same id. */
			async add(projectPath, record) {
				const current = this.store.getSnapshot().bookmarks.slice();
				const index = current.findIndex((entry) => entry.id === record.id);
				if (index >= 0) current[index] = record;
				else current.push(record);
				await this.write(projectPath, current);
			}
			/** Remove a bookmark by id. */
			async remove(projectPath, id) {
				const current = this.store.getSnapshot().bookmarks.filter((entry) => entry.id !== id);
				await this.write(projectPath, current);
			}
			/** Toggle a bookmark: add if absent, remove if present. */
			async toggle(projectPath, record) {
				if (this.store.getSnapshot().bookmarks.some((entry) => entry.id === record.id)) await this.remove(projectPath, record.id);
				else await this.add(projectPath, record);
			}
			async write(projectPath, bookmarks) {
				const result = await this.rpc.call(CHANNEL, "bookmarks/write", {
					projectPath,
					bookmarks
				});
				if (!result.ok) {
					this.fail(result.error.message);
					return;
				}
				this.store.update((state) => {
					state.status = "ready";
					state.bookmarks = bookmarks;
				});
			}
			fail(message) {
				this.store.update((state) => {
					state.status = "error";
					state.error = message;
				});
			}
		};
		//#endregion
		//#region lib/client/current-session.js
		/** Observable source that tracks the currently selected session snapshot. */
		/**
		* Build a source that always reflects the current session's conversation snapshot.
		* The source is intended for a root-scope component that does not receive `useSession`.
		* @param ctx - client root context.
		* @returns observable source and its disposal.
		*/
		function createCurrentSessionSource(ctx) {
			const store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)(void 0, { flush: "sync" });
			let unsubscribeSession;
			const sync = () => {
				unsubscribeSession?.();
				unsubscribeSession = void 0;
				const currentId = ctx.sessions.list.getSnapshot().current;
				if (currentId === void 0) {
					store.set(void 0);
					return;
				}
				const binding = ctx.sessions.binding(currentId);
				if (binding === void 0) {
					store.set(void 0);
					return;
				}
				const session = binding.session;
				store.set(session.getSnapshot());
				unsubscribeSession = session.subscribe(() => {
					store.set(session.getSnapshot());
				});
			};
			const unsubscribeList = ctx.sessions.list.subscribe(sync);
			sync();
			return {
				getSnapshot: () => store.getSnapshot(),
				subscribe: (listener) => store.subscribe(listener),
				dispose: () => {
					unsubscribeList();
					unsubscribeSession?.();
				}
			};
		}
		//#endregion
		//#region lib/client/locales.js
		/** Locale namespace for the artifact viewer. */
		const NS = "artifact-viewer";
		const zh = {
			"toggle.label": "产物",
			"toggle.tooltip": "打开产物侧边栏",
			"panel.title": "产物",
			"panel.list": "显示产物列表",
			"panel.close": "关闭",
			"panel.bookmarks": "收藏",
			"panel.expand": "放大",
			"panel.shrink": "缩小",
			"tab.current": "当前会话",
			"tab.bookmarks": "收藏",
			"tab.close": "关闭标签页",
			"empty.current": "当前会话暂无产物",
			"empty.bookmarks": "暂无收藏",
			"artifact.open": "打开文件",
			"artifact.preview": "预览",
			"artifact.copy": "复制内容",
			"artifact.copied": "已复制",
			"artifact.bookmark": "收藏",
			"artifact.bookmarked": "已收藏",
			"artifact.session": "打开生成对话",
			"artifact.remove": "取消收藏",
			"artifact.kind.image": "图片",
			"artifact.kind.file": "文件",
			"artifact.kind.json": "JSON",
			"artifact.kind.video": "视频",
			"artifact.kind.unknown": "未知",
			"preview.error": "预览失败",
			"preview.oversized": "文件过大"
		};
		const en = {
			"toggle.label": "Artifacts",
			"toggle.tooltip": "Open artifact sidebar",
			"panel.title": "Artifacts",
			"panel.list": "Show artifact list",
			"panel.close": "Close",
			"panel.bookmarks": "Bookmarks",
			"panel.expand": "Expand",
			"panel.shrink": "Shrink",
			"tab.current": "Current session",
			"tab.bookmarks": "Bookmarks",
			"tab.close": "Close tab",
			"empty.current": "No artifacts in current session",
			"empty.bookmarks": "No bookmarks yet",
			"artifact.open": "Open file",
			"artifact.preview": "Preview",
			"artifact.copy": "Copy content",
			"artifact.copied": "Copied",
			"artifact.bookmark": "Bookmark",
			"artifact.bookmarked": "Bookmarked",
			"artifact.session": "Open source conversation",
			"artifact.remove": "Remove",
			"artifact.kind.image": "Image",
			"artifact.kind.file": "File",
			"artifact.kind.json": "JSON",
			"artifact.kind.video": "Video",
			"artifact.kind.unknown": "Unknown",
			"preview.error": "Preview failed",
			"preview.oversized": "File too large"
		};
		//#endregion
		//#region lib/client/store.js
		/** Shared UI-state store for the artifact viewer panel. */
		const createArtifactViewerStore = () => (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
			init: () => ({
				panelOpen: false,
				activeTab: "current",
				expanded: false,
				width: 420
			}),
			actions: {
				togglePanel: (draft) => {
					draft.panelOpen = !draft.panelOpen;
				},
				openPanel: (draft) => {
					draft.panelOpen = true;
				},
				closePanel: (draft) => {
					draft.panelOpen = false;
				},
				setTab: (draft, tab) => {
					draft.activeTab = tab;
				},
				toggleExpand: (draft) => {
					draft.expanded = !draft.expanded;
				},
				setWidth: (draft, width) => {
					draft.width = width;
				},
				openArtifactByPath: (draft, path) => {
					draft.panelOpen = true;
					draft.activeTab = "current";
					draft.pendingOpenPath = path;
				},
				clearPendingOpenPath: (draft) => {
					draft.pendingOpenPath = void 0;
				}
			}
		});
		//#endregion
		//#region lib/client/index.js
		/**
		* Browser half of the artifact-viewer plugin.
		*
		* Registers a sidebar footer toggle, a right-hand overlay panel, and an
		* intercepted message-image renderer that adds bookmark stars.
		*
		* @module @wang-junjian/dsh-artifact-viewer/client
		*/
		/** Services required by the browser half. */
		const inject = [
			"slots",
			"locale",
			"sessions",
			"connection",
			"workspaces"
		];
		/**
		* Register the artifact viewer surfaces.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "artifact-viewer: dictionaries");
			const rpc = ctx.get("connection").rpc;
			const bookmarks = new BookmarkController(rpc);
			const viewerStore = createArtifactViewerStore();
			const currentSession = createCurrentSessionSource(ctx);
			ctx.effect(() => currentSession.dispose, "artifact-viewer: current-session source");
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "artifact-viewer-toggle",
				order: 50,
				locale: NS,
				store: viewerStore
			}, ArtifactToggle));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "artifact-viewer-panel",
				order: 50,
				locale: NS,
				store: viewerStore,
				inject: () => ({
					hooks: {
						currentSession,
						bookmarks: bookmarks.store
					},
					bookmarks,
					rpc,
					onOpenPath: (path) => ctx.workspaces.openPath(path),
					onOpenSession: (sessionId) => ctx.sessions.open(sessionId)
				})
			}, ArtifactPanel));
			ctx.slots.inject("conversation.message.images", () => ctx.slots.register({
				name: "conversation.message.images",
				locale: NS,
				priority: -1,
				inject: () => ({
					hooks: { bookmarks: bookmarks.store },
					bookmarks
				})
			}, ArtifactMessageImages));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
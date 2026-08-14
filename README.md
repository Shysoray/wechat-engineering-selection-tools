# 选型工具中心小程序

这是一个微信小程序原型，用主页面承载多个工程选型工具入口。当前已实现 `CV 值换算`、`管接头型号对标`、`调压阀选型` 和 `材质兼容性查询`。

## 目录

- `pages/index/`：主页面，展示各功能入口
- `pages/cv/`：CV 值换算页面
- `packageFitting/pages/`：管接头型号对标页面
- `pages/regulator/`：调压阀选型页面
- `pages/compatibility/`：材质兼容性查询页面
- `pages/cv/utils/cvCalculator.js`：Cv / 流量换算、介质比重和单位换算逻辑
- `node tools/check_miniprogram_package_sizes.js`：按 `app.json` 分包和 `project.config.json` 忽略规则检查每个源码包是否低于 2 MB
- `packageFitting/fittingDatabase.js`：生成后的管接头对标数据库
- `packageFitting/matchingEngine.js`：型号别名、精确索引和安全模糊匹配纯函数
- `packageFitting/resultPolicy.js`：结果分级、复核提示和销售复制策略
- `packageFitting/mappingRepository.js`：多数据源合并及条件选型数据访问
- `packageFitting/batchInput.js`：批量分隔符、组合型号和 100 条上限规则
- `tools/build_fitting_database.py`：管接头数据库生成规则
- `docs/fitting-matching-checklist.md`：管接头对标问题总结与后续避坑清单

## 当前功能

### CV 值换算

支持：

- 计算类型：计算 Cv、计算流量
- 介质类型：气体、液体
- 压力单位：MPa、bar、kPa、PSIA、PSIG
- 气体流量单位：SCFM、std L/min、std m3/h、std m3/min
- 液体流量单位：gpm、L/h、L/min、L/s、m3/h
- 温度单位：℃、℉、K

气体计算采用绝对压力；选择 PSIG 时会自动换算为 PSIA。该工具用于工程初算，正式应用前仍需按产品样本、工况边界和安全要求复核。

### 管接头型号对标

当前整理了 VIGOUR 与 Swagelok、JSK、FUJIKIN、FITOK、TK-Fujikin、SUPERLOK、UNILOK 的候选映射。FITOK 数据来自 FR、M、L 三份官方英文目录。该功能用于初选，不代表尺寸、材质和表面处理已经完全等同。新增型号或品牌前必须阅读并执行[管接头对标避坑清单](docs/fitting-matching-checklist.md)。

批量校验支持换行、中英文逗号和中英文分号分隔，单次最多 100 个型号；超过上限时不会生成或复制部分结果。已知无 VIGOUR 对应型号会作为明确的 `no-match` 保护记录保留，不允许回退为模糊推荐。

主数据库生成时会同步输出审计文件。无法解析或缺少安全目标的目录型号必须转为不可选、不可复制的 `no-match` 精确保护；若仍有未落库的跳过项，`tools/test_fitting_generation_audit.js` 会失败。

## 运行

用微信开发者工具导入本目录即可预览。当前 `appid` 使用的是 `touristappid`，发布前需要替换成正式小程序 AppID。

## 许可证

本项目采用 [MIT License](LICENSE)。

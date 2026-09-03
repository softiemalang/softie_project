---
license: apache-2.0
task_categories:
  - image-to-text
language:
  - zh
tags:
  - htr
  - ocr
  - chinese
  - historical-documents
  - xylography
  - medieval-chinese
  - classical-chinese
  - ground-truth
  - calfa
pretty_name: "CHI-KNOW-PO: Chinese Historical HTR Ground-Truth"
size_categories:
  - 10K<n<100K
configs:
  - config_name: default
    data_files:
      - split: train
        path: data/train-*
      - split: validation
        path: data/validation-*
      - split: test
        path: data/test-*
---

# CHI-KNOW-PO — Line-Level HTR Ground-Truth for Chinese Historical Texts

<p align="center">
  <a href="https://doi.org/10.1007/978-3-031-70642-4_3"><img src="https://img.shields.io/badge/Paper-ICDAR 2024-blue" alt="Paper"></a>
  <a href="https://github.com/calfa-co/chi-know-po"><img src="https://img.shields.io/badge/GitHub-PageXML dataset-green" alt="GitHub"></a>
  <a href="https://www.collexpersee.eu/projet/chi-know-po-corpus/"><img src="https://img.shields.io/badge/Project-CHI--KNOW--PO-orange" alt="Project"></a>
  <a href="https://calfa.fr"><img src="https://img.shields.io/badge/Platform-Calfa Vision-purple" alt="Calfa"></a>
</p>

## Dataset Description

The **CHI-KNOW-PO** (Chinese Knowledge and Poetry) project aims to digitize and publish an online, searchable corpus of approximately 60,000 pages of xylographed documents from the Chinese medieval period (ca. 200–1000 CE). The corpus covers poetic anthologies, commentaries, dictionaries, encyclopedias, and technical treatises — processed using Handwritten Text Recognition (HTR).

This HuggingFace dataset provides **cropped line-level images** paired with their transcriptions and rich metadata for **13 historical Chinese documents**. It is designed as a ready-to-use benchmark for Chinese historical HTR.

> The full page-level dataset (PageXML + full-page images) is available on [GitHub](https://github.com/calfa-co/chi-know-po).

### Key Features

- **13,634 cropped text-line images** from 325 annotated pages
- **104,769 transcribed characters** covering **5,589 unique sinograms**
- **13 documents** spanning 9 genres: anthologies, encyclopedias, dictionaries, commentaries, collections, essays, and technical treatises
- **Semantic metadata** per line: document ID, title (Chinese/English), type, author, edition, library, call number
- **Stratified train/val/test splits** (80/10/10) by document

## Dataset Composition

| N° | Abbreviation | Title (Chinese) | Type | Pages | Lines | Characters |
|:---|:-------------|:-----------------|:-----|------:|------:|-----------:|
| A-1 | Li Wenxuan | 李善注文選 | Belles Lettres | 56 | 1,654 | 15,650 |
| A-3 | Yutai | 玉臺新詠 | Belles Lettres | 10 | 590 | 4,818 |
| A-4 | Tangshi | 全唐詩 | Belles Lettres | 10 | 492 | 3,592 |
| S-1 | Beitang | 北堂書鈔 | Encyclopedia | 35 | 1,508 | 12,940 |
| S-2 | Bowu zhi | 博物志 | Essay | 23 | 302 | 3,786 |
| S-3 | Chuxue | 初學記 | Encyclopedia | 20 | 1,267 | 11,572 |
| S-4 | Erya | 影宋鈔繪圖爾雅 | Dictionary | 38 | 2,532 | 8,568 |
| S-5 | Maoshi shu | 毛詩草木鳥獸蟲魚疏 | Commentary | 10 | 397 | 3,980 |
| S-6 | Yiwen | 藝文類聚 | Encyclopedia | 11 | 356 | 3,524 |
| S-7 | Zhibuzu | 知不足齋叢書 | Collection | 49 | 1,766 | 13,810 |
| T-1 | Shiwen leiju | 古今事文類聚 | Practical Encyclopedia | 20 | 1,053 | 7,285 |
| T-2 | Qimin yaoshu | 齊民要術 | Agricultural treatise | 20 | 885 | 8,711 |
| T-3 | Xinzhai | 心齋十種 | Practical collection | 23 | 832 | 6,533 |
| | **TOTAL** | | | **325** | **13,634** | **104,769** |

## Data Splits

Splits are stratified by `doc_id` to ensure proportional representation of each document in every split.

| Split | Lines | Percentage |
|:------|------:|-----------:|
| Train | 10,907 | 80.0% |
| Validation | 1,363 | 10.0% |
| Test | 1,364 | 10.0% |

## Data Fields

| Field | Type | Description |
|:------|:-----|:------------|
| `image` | `Image` | Cropped line-level image (JPEG) |
| `file_name` | `string` | Original image filename |
| `transcription` | `string` | Ground-truth transcription of the text line |
| `source_page` | `string` | Filename of the source full-page image |
| `doc_id` | `string` | Document identifier (e.g. `A-1`, `S-3`, `T-2`) |
| `title_zh` | `string` | Document title in Chinese |
| `title_en` | `string` | Document title in romanized form |
| `title_abbr` | `string` | Abbreviated title used in the paper |
| `author` | `string` | Author of the work |
| `compiler` | `string` | Compiler of the work (if applicable) |
| `main_text_creation` | `string` | Date or period of original text composition |
| `edition` | `string` | Edition date of the physical copy |
| `type` | `string` | Genre/type of the document |
| `library` | `string` | Holding library |
| `call_number` | `string` | Library call number |

## Usage

```python
from datasets import load_dataset

# Load the full dataset
ds = load_dataset("calfa-ai/chiknowpo")

# Access a sample
sample = ds["train"][0]
sample["image"].show()
print(sample["transcription"])

# Filter by document
beitang = ds["train"].filter(lambda x: x["doc_id"] == "S-1")
```

## Source Documents

The documents are xylographed (woodblock-printed) editions from late imperial China, preserved in three French libraries:

- **BNU** — Bibliothèque nationale et universitaire de Strasbourg
- **BULAC** — Bibliothèque universitaire des langues et civilisations (Paris)
- **BIHEC** — Bibliothèque de l'Institut des hautes études chinoises, Collège de France (Paris)

Each page typically features vertical columns read from top to bottom and right to left. Commentaries are embedded in double columns with smaller font, interleaved within the main text — a layout characteristic of Chinese xylographic editions.

### Corpus Description

The corpus was designed to represent a literate library of the Chinese first millennium (ca. 200–1000 CE), excluding Buddhist texts. It favors thematic coherence around plants and co-occurrences across genres: knowledge texts (lexicons, encyclopedias), poetry, treatises on *materia medica*, and agricultural treatises.

Three categories of texts are represented:

- **Anthologies (A):** Collections of poetry and belles-lettres with scholarly commentaries (*Wenxuan*, *Yutai xinyong*, *Quan Tang shi*).
- **Scholarship (S):** Encyclopedias, dictionaries, commentaries, and reference compilations (*Beitang shuchao*, *Chuxue ji*, *Erya*, *Yiwen leiju*, etc.).
- **Technical and practical knowledge (T):** Agricultural treatises and practical encyclopedias (*Qimin yaoshu*, *Shiwen leiju*, *Xinzhai*).

### Annotation Process

Annotations were made on the [Calfa Vision](https://vision.calfa.fr) platform, a free web-based annotation tool for documents and images designed for Oriental scripts. The platform incorporates active learning strategies, automatically generating and refining layout and text predictions as annotations progress.

## Benchmark Results

HTR results using a CRNN architecture enhanced with GAN-augmented data (CycleGAN for rare character augmentation). A generic model was first trained on all documents, then fine-tuned per target manuscript:

| Document | N° | Accuracy (%) |
|:---------|:---|:-------------|
| Li Wenxuan | A-1 | 99.38 (± 1.2) |
| Yutai | A-3 | 98.52 (± 1.2) |
| Tangshi | A-4 | 99.25 (± 1.8) |
| Beitang | S-1 | 98.76 (± 1.8) |
| Bowu zhi | S-2 | 99.18 (± 1.8) |
| Chuxue | S-3 | 97.57 (± 1.7) |
| Erya | S-4 | 96.57 (± 0.4) |
| Maoshi shu | S-5 | 98.42 (± 1.8) |
| Yiwen | S-6 | 98.72 (± 1.7) |
| Zhibuzu | S-7 | 98.70 (± 1.8) |
| Shiwen leiju | T-1 | 97.47 (± 4.5) |
| Qimin yaoshu | T-2 | 99.35 (± 2.8) |
| Xinzhai | T-3 | 97.61 (± 3.2) |

**Average accuracy: 98.45% (± 1.9%)**

The accuracy figures (±) account for predictions following uncontrolled layout detection. Recognition accuracy for unknown characters (including GAN-generated ones) reaches 86.21%.

## Challenges

Working with this corpus presents several specific challenges:

- **Character diversity:** 5,589 unique sinograms, with 30.46% appearing only once in the dataset — a significant few-shot learning challenge.
- **Character imbalance:** Most frequent characters (之: 2,239 samples; 也: 1,552; 曰: 1,549) vs. rare characters with a single occurrence.
- **Graphic variants** (*yi ti zi* 異體字): Xylographic printing preserves handwriting diversity, leading to graphic variants not standardized in Unicode.
- **Complex layouts:** Main text and commentaries interleaved in single/double columns with different font sizes.
- **Reading order:** Right-to-left, top-to-bottom hierarchical reading complicated by embedded commentaries.

## Related Resources

- **Paper:** [Optimizing HTR and Reading Order Strategies for Chinese Imperial Editions with Few-Shot Learning](https://doi.org/10.1007/978-3-031-70642-4_3) (ICDAR 2024 Workshops)
- **PageXML dataset (GitHub):** [calfa-co/chi-know-po](https://github.com/calfa-co/chi-know-po)
- **Project page:** [CHI-KNOW-PO Corpus (CollEx-Persée)](https://www.collexpersee.eu/projet/chi-know-po-corpus/)
- **GitLab (research):** [gitlab.huma-num.fr/chi-know-po](https://gitlab.huma-num.fr/chi-know-po)
- **Annotation platform:** [Calfa Vision](https://vision.calfa.fr)

## Citation

```bibtex
@InProceedings{10.1007/978-3-031-70642-4_3,
  author    = {Bizais-Lillig, Marie and Vidal-Gor{\`e}ne, Chahan and Dupin, Boris},
  editor    = {Mouch{\`e}re, Harold and Zhu, Anna},
  title     = {Optimizing HTR and Reading Order Strategies for Chinese Imperial Editions with Few-Shot Learning},
  booktitle = {Document Analysis and Recognition -- ICDAR 2024 Workshops},
  year      = {2024},
  publisher = {Springer Nature Switzerland},
  address   = {Cham},
  pages     = {37--56}
}
```

## License

This dataset is released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

## Acknowledgements

The CHI-KNOW-PO project was funded by the University of Strasbourg Institute for Advanced Studies (USIAS) and CollEx-Persée. It was conducted in collaboration with three libraries in France: the BULAC (Paris), the BNU (Strasbourg), and the BIHEC at the Collège de France (Paris). The Calfa start-up was in charge of developing HTR models.

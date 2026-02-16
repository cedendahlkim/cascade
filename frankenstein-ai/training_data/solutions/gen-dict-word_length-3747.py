# Task: gen-dict-word_length-3747 | Score: 100% | 2026-02-12T12:14:23.625945

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))
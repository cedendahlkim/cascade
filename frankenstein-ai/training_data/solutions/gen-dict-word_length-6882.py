# Task: gen-dict-word_length-6882 | Score: 100% | 2026-02-12T20:29:54.826104

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))
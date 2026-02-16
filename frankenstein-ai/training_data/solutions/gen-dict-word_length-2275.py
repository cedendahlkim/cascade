# Task: gen-dict-word_length-2275 | Score: 100% | 2026-02-12T12:11:05.496897

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))
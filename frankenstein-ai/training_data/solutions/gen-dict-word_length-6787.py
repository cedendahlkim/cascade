# Task: gen-dict-word_length-6787 | Score: 100% | 2026-02-12T19:28:09.544998

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))
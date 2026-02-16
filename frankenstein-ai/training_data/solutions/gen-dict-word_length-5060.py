# Task: gen-dict-word_length-5060 | Score: 100% | 2026-02-12T12:16:46.937731

text = input()
words = text.split()
unique_words = sorted(list(set(words)))
for word in unique_words:
    print(word, len(word))
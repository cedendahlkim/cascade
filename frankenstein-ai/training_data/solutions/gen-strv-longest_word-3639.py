# Task: gen-strv-longest_word-3639 | Score: 100% | 2026-02-12T13:16:24.422458

text = input()
words = text.split()
longest_word = ""
for word in words:
    if len(word) > len(longest_word):
        longest_word = word
print(longest_word)
# Task: gen-strv-longest_word-9074 | Score: 100% | 2026-02-12T15:15:07.538633

text = input()
words = text.split()
longest_word = ""
for word in words:
    if len(word) > len(longest_word):
        longest_word = word
print(longest_word)
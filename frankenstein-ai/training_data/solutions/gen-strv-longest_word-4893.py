# Task: gen-strv-longest_word-4893 | Score: 100% | 2026-02-12T12:15:05.776502

text = input()
words = text.split()
longest_word = ""
for word in words:
    if len(word) > len(longest_word):
        longest_word = word
print(longest_word)
# Task: gen-strv-longest_word-9524 | Score: 100% | 2026-02-12T12:49:34.940687

words = input().split()
longest_word = ""
for word in words:
    if len(word) > len(longest_word):
        longest_word = word
print(longest_word)
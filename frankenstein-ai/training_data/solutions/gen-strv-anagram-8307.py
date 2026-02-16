# Task: gen-strv-anagram-8307 | Score: 100% | 2026-02-13T19:48:30.032601

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
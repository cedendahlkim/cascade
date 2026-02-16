# Task: gen-strv-anagram-8132 | Score: 100% | 2026-02-13T09:17:08.133521

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
# Task: gen-ds-reverse_with_stack-6444 | Score: 100% | 2026-02-15T07:48:38.599720

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
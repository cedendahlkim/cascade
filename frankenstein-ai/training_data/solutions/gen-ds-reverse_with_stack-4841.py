# Task: gen-ds-reverse_with_stack-4841 | Score: 100% | 2026-02-15T07:49:05.591040

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
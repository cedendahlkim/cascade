# Task: gen-ds-reverse_with_stack-7638 | Score: 100% | 2026-02-14T12:48:01.787040

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
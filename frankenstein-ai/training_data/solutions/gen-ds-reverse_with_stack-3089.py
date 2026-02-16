# Task: gen-ds-reverse_with_stack-3089 | Score: 100% | 2026-02-13T17:11:47.076641

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
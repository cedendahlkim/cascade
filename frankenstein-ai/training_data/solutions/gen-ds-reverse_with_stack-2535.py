# Task: gen-ds-reverse_with_stack-2535 | Score: 100% | 2026-02-14T12:02:39.018548

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
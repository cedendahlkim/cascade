# Task: gen-ds-reverse_with_stack-3386 | Score: 100% | 2026-02-14T13:25:59.918989

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
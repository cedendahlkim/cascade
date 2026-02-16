# Task: gen-ds-reverse_with_stack-5287 | Score: 100% | 2026-02-14T12:02:17.320532

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
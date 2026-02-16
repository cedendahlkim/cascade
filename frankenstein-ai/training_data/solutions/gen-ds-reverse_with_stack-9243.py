# Task: gen-ds-reverse_with_stack-9243 | Score: 100% | 2026-02-14T12:02:07.799605

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
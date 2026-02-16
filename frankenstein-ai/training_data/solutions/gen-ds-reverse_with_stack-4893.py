# Task: gen-ds-reverse_with_stack-4893 | Score: 100% | 2026-02-13T18:29:07.668654

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
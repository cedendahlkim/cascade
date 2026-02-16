# Task: gen-ds-reverse_with_stack-1988 | Score: 100% | 2026-02-13T18:19:39.384596

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
# Task: gen-ds-reverse_with_stack-4581 | Score: 100% | 2026-02-13T18:51:22.234011

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
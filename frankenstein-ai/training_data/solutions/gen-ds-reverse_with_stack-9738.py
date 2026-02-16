# Task: gen-ds-reverse_with_stack-9738 | Score: 100% | 2026-02-13T15:27:48.615461

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
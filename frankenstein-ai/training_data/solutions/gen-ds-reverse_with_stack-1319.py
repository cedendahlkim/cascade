# Task: gen-ds-reverse_with_stack-1319 | Score: 100% | 2026-02-13T13:46:41.393229

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
# Task: gen-ds-reverse_with_stack-8159 | Score: 100% | 2026-02-13T14:00:39.648756

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
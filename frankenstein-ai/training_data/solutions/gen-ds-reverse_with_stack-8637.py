# Task: gen-ds-reverse_with_stack-8637 | Score: 100% | 2026-02-13T14:00:53.907407

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
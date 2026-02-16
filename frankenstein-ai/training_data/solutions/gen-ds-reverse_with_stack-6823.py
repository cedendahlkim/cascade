# Task: gen-ds-reverse_with_stack-6823 | Score: 100% | 2026-02-13T18:23:58.773433

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
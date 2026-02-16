# Task: gen-ds-reverse_with_stack-9001 | Score: 100% | 2026-02-13T18:39:53.877397

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
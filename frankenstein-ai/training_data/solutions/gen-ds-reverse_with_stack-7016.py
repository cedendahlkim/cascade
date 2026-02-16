# Task: gen-ds-reverse_with_stack-7016 | Score: 100% | 2026-02-13T11:18:11.102394

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
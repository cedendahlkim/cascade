# Task: gen-ds-reverse_with_stack-4739 | Score: 100% | 2026-02-13T18:33:39.280961

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
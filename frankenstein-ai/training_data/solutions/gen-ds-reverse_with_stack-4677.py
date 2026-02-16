# Task: gen-ds-reverse_with_stack-4677 | Score: 100% | 2026-02-13T15:10:56.519245

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
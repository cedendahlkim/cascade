# Task: gen-ds-reverse_with_stack-5064 | Score: 100% | 2026-02-13T13:40:10.963787

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
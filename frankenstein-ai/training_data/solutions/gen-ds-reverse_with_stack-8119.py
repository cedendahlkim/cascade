# Task: gen-ds-reverse_with_stack-8119 | Score: 100% | 2026-02-15T13:30:55.436238

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
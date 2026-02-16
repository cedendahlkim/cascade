# Task: gen-ds-reverse_with_stack-7483 | Score: 100% | 2026-02-15T10:51:00.882501

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
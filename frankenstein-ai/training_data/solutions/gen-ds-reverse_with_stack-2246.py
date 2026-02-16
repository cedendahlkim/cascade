# Task: gen-ds-reverse_with_stack-2246 | Score: 100% | 2026-02-15T10:51:12.537994

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
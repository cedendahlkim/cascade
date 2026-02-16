# Task: gen-ds-reverse_with_stack-8179 | Score: 100% | 2026-02-15T10:50:23.609353

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
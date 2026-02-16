# Task: gen-ds-reverse_with_stack-4622 | Score: 100% | 2026-02-15T12:30:29.815223

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
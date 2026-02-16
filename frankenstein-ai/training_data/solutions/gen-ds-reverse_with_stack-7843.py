# Task: gen-ds-reverse_with_stack-7843 | Score: 100% | 2026-02-15T12:29:18.498045

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
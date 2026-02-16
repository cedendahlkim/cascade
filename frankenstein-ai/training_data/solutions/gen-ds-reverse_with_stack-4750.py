# Task: gen-ds-reverse_with_stack-4750 | Score: 100% | 2026-02-15T08:24:22.583260

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
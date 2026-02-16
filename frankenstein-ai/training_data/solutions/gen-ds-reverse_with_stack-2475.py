# Task: gen-ds-reverse_with_stack-2475 | Score: 100% | 2026-02-15T09:35:13.818787

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
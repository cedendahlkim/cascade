# Task: gen-ds-reverse_with_stack-9106 | Score: 100% | 2026-02-15T08:13:41.867639

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
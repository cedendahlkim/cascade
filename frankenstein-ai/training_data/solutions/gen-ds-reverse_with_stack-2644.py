# Task: gen-ds-reverse_with_stack-2644 | Score: 100% | 2026-02-15T09:01:32.135353

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
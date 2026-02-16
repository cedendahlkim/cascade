# Task: gen-ds-reverse_with_stack-7706 | Score: 100% | 2026-02-15T08:14:03.605847

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))